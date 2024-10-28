import helmet from 'helmet'
import { NestFactory } from '@nestjs/core'
import { FAssetIndexerModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'


async function bootstrap() {
  const app = await NestFactory.create(FAssetIndexerModule)
  const config = new DocumentBuilder()
    .setTitle('FAsset Indexer')
    .setDescription('Api for the FAsset indexer')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)
  await app.use(helmet()).listen(3000)
}

bootstrap()
