import awsLambdaFastify from '@fastify/aws-lambda'
import { buildApp } from './app.js'

export const handler = awsLambdaFastify(buildApp())
