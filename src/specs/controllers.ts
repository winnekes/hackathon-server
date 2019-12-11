import { Exclude } from 'class-transformer';
import {
    Get,
    getMetadataArgsStorage,
    JsonController,
} from 'routing-controllers';
import { routingControllersToSpec, OpenAPI } from 'routing-controllers-openapi';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { MetadataStorage, getFromContainer } from 'class-validator';

@JsonController()
export default class SpecController {
    @Get('/spec')
    getSpec() {
        const metadatas = (getFromContainer(MetadataStorage) as any)
            .validationMetadatas;

        const schemas = validationMetadatasToSchemas(metadatas, {
            refPointerPrefix: '#/components/schemas/',
        });

        const storage = getMetadataArgsStorage();
        const spec = routingControllersToSpec(
            storage,
            {},
            {
                components: {
                    schemas,
                    securitySchemes: {
                        bearerAuth: {
                            scheme: 'bearer',
                            type: 'http',
                            bearerFormat: 'JWT',
                        },
                    },
                },
                info: { title: 'travelin', version: '1.0.0' },
            }
        );
        console.log(spec);
        return spec;
    }
}
