import helmet from 'helmet'
import { NestFactory } from '@nestjs/core'
import { FAssetIndexerModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiConfig } from './config'

let apiDoc = 'api-doc'

async function bootstrap() {
  const app = await NestFactory.create(FAssetIndexerModule)
  if (apiConfig.rootPath != null && apiConfig.rootPath != '') {
    app.setGlobalPrefix(apiConfig.rootPath)
    apiDoc = apiConfig.rootPath + '/' + apiDoc
  }
  const config = new DocumentBuilder()
    .setTitle('FAsset Indexer')
    .setDescription('Api for the FAsset indexer')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup(apiDoc, app, document)
  await app.use(helmet()).listen(apiConfig.port)
}

bootstrap()
