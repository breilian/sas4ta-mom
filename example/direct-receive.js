let amqp = require('amqplib');

const queueName = 'direct_queue';
const url = process.argv.slice(2)[0];

(async () => {
    const connect = await amqp.connect(url);
    const channel = await connect.createChannel();
   
    await channel.assertQueue(queueName, {durable: false});

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queueName);

    await channel.consume(
        queueName, 
        message => console.log(" [x] Received %s", message.content.toString()),
        {
            noAck: true
        });
})();