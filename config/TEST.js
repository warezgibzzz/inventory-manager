module.exports = {
  DEBUG: false,
  OSSEUS_LOGGER_LOG_LEVEL: 'info',
  OSSEUS_LOGGER_NO_CONSOLE_OVERRIDE: true,
  OSSEUS_SERVER_DEPENDENCIES: ['logger', 'mongo'],
  OSSEUS_SERVER_PORT: '8081',
  OSSEUS_SERVER_MORGAN_FORMAT: ':date[iso] method=":method", url=":url", statusCode=":status", route=":route", host=":host", client-ip=":client-ip", user-agent=":user-agent", httpVersion=":http-version", responseTime=":response-time"',
  OSSEUS_SERVER_ADD_HEALTHCHECK: true,
  OSSEUS_SERVER_ADD_IS_RUNNING: true,
  OSSEUS_ROUTER_DEPENDENCIES: ['logger', 'server'],
  OSSEUS_ROUTER_ROUTES_PATH: '/app/routes',
  OSSEUS_ROUTER_CONTROLLERS_PATH: '/app/controllers',
  OSSEUS_ROUTER_POLICY_PATH: '/app/middlewares',
  OSSEUS_ROUTER_URL_PREFIX: '/api',
  OSSEUS_ROUTER_JWT_SECRET: '3g4Zy5rM7p9nV7Y3Xl7zKY4IvJo2n5lFUUTwHUGPn6',
  OSSEUS_MONGO_DEPENDENCIES: ['logger'],
  OSSEUS_MONGO_URI: 'mongodb://localhost/inventory-manager-tests',
  WEB3_PROVIDER: 'http://127.0.0.1:7545',
  SECRET: '46fffed0-d51f-4c54-9096-e9e95e3643fbthisissomekindofsecret',
  BLOCKS_TO_CONFIRM_BCTX: 20
}
