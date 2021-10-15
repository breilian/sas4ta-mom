let amqp = require('amqplib/callback_api');

// let args = process.argv.slice(2);

// if (args.length == 0) {
//   console.log("Usage: rpc_client.js num");
//   process.exit(1);
// }

amqp.connect('amqps://zqjdagji:FzLnkKffmRAZHSwC7Ec1HlM1cojTupVw@cow.rmq2.cloudamqp.com/zqjdagji', function(error0, connection) {
  if (error0) {
    throw error0;
  }

  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }

    channel.assertQueue('', {
      exclusive: true
    }, function(error2, q) {
      if (error2) {
        throw error2;
      }
      let correlationId = generateUuid();
    //   let input = args[0];

    //   console.log(' [x] Requesting to process %s', input);

      channel.consume(q.queue, function(msg) {
        if (msg.properties.correlationId == correlationId) {
          console.log(' [.] Got %s', msg.content.toString());
        //   setTimeout(function() {
        //     connection.close();
        //     process.exit(0)
        //   }, 500);
        }
      }, {
        noAck: true
      });

    //   channel.sendToQueue('rpc_queue',
    //     Buffer.from(input.toString()),{
    //       correlationId: correlationId,
    //       replyTo: q.queue });

        function streamMessages() {
            let msg = Math.random().toString(36).substring(2, 3 + Math.floor(Math.random() * 4));
            console.log(' [x] Requesting to process %s', msg);
            
            channel.sendToQueue('rpc_queue', Buffer.from(msg),
                {
                    correlationId: correlationId,
                    replyTo: q.queue
                });

            setTimeout(streamMessages, 4000);
        }

        streamMessages();
    });
  });
});

function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}
