let expect = require('chai').expect;
let amqp = require('amqplib');
let waitUntil = require('wait-until');

const url = process.env.npm_config_url;
const rpcQueue = 'rpc_queue';
const streamLength = 15;
const messageMaxLength = 5;
const messages = Array.from(Array(streamLength), i => Math.random().toString(36).substring(2, 3 + Math.floor(Math.random() * messageMaxLength)));
const receivedMessages = []; 
let connection;
const correlationId = Math.random().toString() + Math.random().toString() + Math.random().toString();

describe('RPC model', () => {

    before('Setup connection', async () => {
        console.log(" [Before] Setup connection");

        connection = await amqp.connect(url);
    });

    before('RPC : Start server', async () => {
        console.log(" [Before] RPC : Start server");

        const serverChannel = await connection.createChannel();
        await serverChannel.assertQueue(rpcQueue, {durable: false});
        await serverChannel.prefetch(1);

        serverChannel.consume(
            rpcQueue, 
            message => {
                if (correlationId === message.properties.correlationId) {
                    let input = message.content.toString();

                    console.log(" [Server] received message %s", input);
                    
                    let response = input.toUpperCase();
    
                    serverChannel.sendToQueue(message.properties.replyTo,
                        Buffer.from(response), {
                            correlationId: message.properties.correlationId
                        });
                    
                    console.log(" [Server] sent message %s", response);
                }
    
                serverChannel.ack(message);
            });
                
    });

    before('RPC : Start client', async () => {
        console.log(" [Before] Start client");

        const clientChannel = await connection.createChannel();
        const clienQueue = await clientChannel.assertQueue('', {exclusive: true});

        messages.forEach(async message => {
            console.log(" [Test] Send message to server queue %s : %s", rpcQueue, message);
            
            await clientChannel.sendToQueue(rpcQueue, Buffer.from(message),
                {
                    correlationId: correlationId,
                    replyTo: clienQueue.queue
                });
        });

        await clientChannel.consume(clienQueue.queue, 
            message => {
                console.log(' [.] In client consume : %s', message.content.toString());
                
                if (message.properties.correlationId == correlationId) {
                    console.log(' [.] Got %s', message.content.toString());
                    receivedMessages.push(message.content.toString());
                }
            },
            {noAck: true});
    });

    it('RPC : Test server by client', async () => {
        console.log(" [Test] Test server by client");

        waitUntil(5000, 15,
            () => receivedMessages.length == streamLength,
            result => {
                expect(receivedMessages).to.have.ordered.members(messages.map(m => m.toUpperCase()));
            });
    });

    after('Close connection', () => {
        console.log(" [After] Close connection");
        connection.close();
    });
});