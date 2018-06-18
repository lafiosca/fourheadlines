# Four_Headlines

[Four_Headlines](https://twitter.com/Four_Headlines) is a Twitter meta-bot made by [@joelafiosca](https://twitter.com/joelafiosca) that runs hourly to tweet a mashup of two of the most recent 100 tweets from [@TwoHeadlines](https://twitter.com/TwoHeadlines) (by [@tinysubversions](https://twitter.com/tinysubversions)) by finding common pivot words.

It's also a repository demonstrating a simple serverless deployment of a simple Twitter bot to AWS Lambda.

## Deployment

If you wanted to deploy a copy of this bot to your AWS account, you'd follow these steps:

1. Install and configure the AWS CLI, npm, and git.
2. Clone this repository.
3. Copy `src/tweeter/config.json.example` to `src/tweeter/config.json` and replace the contents with your Twitter credentials. (You may follow the application creation steps in [one of the various Twitter bot tutorials](https://venturebeat.com/2017/02/02/how-to-build-your-own-twitter-bot-in-less-than-30-minutes/).)
4. Copy `config.sh.example` to `config.sh` and replace the value of `S3BucketArtifacts` with the name of an S3 bucket you have write access to. (This is where your code artifacts will be stored during deployment.)
5. Run `./package.sh` to package and deploy the bot to AWS.

At this point you are done. If you log into the AWS console, you should find a CloudFormation stack named `FourHeadlines` (or whatever you changed the `StackName` to in `config.sh`). This stack should contain a Lambda function named `<StackName>-Tweeter` which will run hourly and tweet. You can look at the CloudWatch logs for the tweeter function to troubleshoot problems.

## Development

Now, obviously you probably don't want to deploy another copy of [Four_Headlines](https://twitter.com/Four_Headlines). It's just provided to you as an example to jump off from. The logic is all in `src/tweeter/index.js`, and it's not even particularly great. Although if you do feel like experimenting with it, there are several `*Factor` constants you might like to tweak to see how they affect the output.

## Acknowledgements

Massive credit is due to [Darius Kazemi](https://twitter.com/tinysubversions) for inspiring this project, open-sourcing his own work, and providing the original bot that this one mashes up. You should also check out his [website](http://tinysubversions.com/) and his [Patreon](https://www.patreon.com/tinysubversions).

