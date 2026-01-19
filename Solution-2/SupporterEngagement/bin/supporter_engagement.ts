#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { SupporterEngagementStack } from '../lib/supporter_engagement-stack';

const app = new cdk.App();

const account = "226892087814";
const region = "us-west-2";

console.log(`🚀 Deploying Michael Team Stack to Account: ${account}, Region: ${region}`);

new SupporterEngagementStack(app, 'MichaelSupporterEngagement', {
  env: { account, region },
  description: 'Supporter Engagement Platform - Michael Team',
  tags: {
    Project: 'SupporterEngagement',
    Team: 'Michael',
    Environment: 'sandbox',
    ManagedBy: 'CDK'
  }
});
