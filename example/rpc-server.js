let amqp = require('amqplib/callback_api');

let args = process.argv.slice(2)[0];

amqp.connect(url, function(error0, connection) {
    if (error0) {
        throw error0;
    }

    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        let queue = 'rpc_queue';

        channel.assertQueue(queue, {
            durable: false
        });
        
        channel.prefetch(1);
        console.log(' [x] Awaiting RPC requests');

        channel.consume(queue, function reply(msg) {
            let input = msg.content.toString();

            console.log(" [.] processInput(%s) in %d second(s)", input, input.length);
            
            let r = processInput(input);

            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(r.toString()), {
                    correlationId: msg.properties.correlationId
                });

                setTimeout(function() {
                    channel.ack(msg);
                }, input.length * 1000);
            
        });
    });
});

function processInput(str) {
    return str.toString().toUpperCase();
}
