let amqp = require('amqplib/callback_api');

const url = process.argv.slice(2)[0];

amqp.connect(url, function(error0, connection) {
    if (error0) {
        throw error0;
    }

    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        let queue = 'direct_queue';

        channel.assertQueue(queue, {
            durable: false
        });

        function streamMessages() {
            let msg = Math.random().toString(36).substring(2,7);
            console.log(" [x] Sent %s", msg);
            channel.sendToQueue(queue, Buffer.from(msg));

            setTimeout(streamMessages, 1000);
        }

        streamMessages();
    });
});