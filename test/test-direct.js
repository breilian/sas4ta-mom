let assert = require('assert');
var expect = require('chai').expect;
let amqp = require('amqplib');

const url = process.env.npm_config_url;
const queueName = 'direct_queue';
const streamLength = 15;
const messageMaxLength = 5;
let messages = Array.from(Array(streamLength), i => Math.random().toString(36).substring(2, 3 + Math.floor(Math.random() * messageMaxLength)));
let receivedMessages = []; 
let connection;
let consumerChannel;

describe('Direct queue', () => {

    before('Setup connection', async () => {
        console.log(" [Before] Setup connection");

        connection = await amqp.connect(url);
    });

    before('Direct : Produce messages', async () => {
        console.log(" [Before] Direct : Produce messages");

        const producerChannel = await connection.createChannel();
        await producerChannel.assertQueue(queueName, {durable: false});

        console.log(" [Before] %s size is expected to be %d", queueName, messages.length);

        messages.forEach(message => {
            console.log(" [Before] Sent message to %s : %s", queueName, message);
            producerChannel.sendToQueue(queueName, Buffer.from(message));
        });
    });

    before('Direct : Consume messages', async () => {
        console.log(" [Before] Direct : Consume messages");

        consumerChannel = await connection.createChannel();
        await consumerChannel.assertQueue(queueName, {durable: false});
        
        await consumerChannel.consume(
            queueName, 
            message => {
                console.log(" [Test] Received %s", message.content.toString());
                receivedMessages.push(message.content.toString());
            },
            {
                noAck: true
            });
    });

    it('Direct : Test cunsumer', async () => {
        console.log(" [Test] Check messages from consumer side");

        expect(receivedMessages).to.have.ordered.members(messages);
    });

    after('Close connection', () => {
        console.log(" [After] Close connection");
        connection.close();
    });
});