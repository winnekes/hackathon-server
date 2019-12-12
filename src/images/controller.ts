import {
    Authorized,
    Body,
    Ctx,
    CurrentUser,
    Delete,
    Get,
    JsonController,
    NotFoundError,
    Param,
    Post,
    Put,
    Res,
    UploadedFile,
    BadRequestError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi/build/decorators';
import User from '../users/entity';
import Image from './entity';
import Event from '../events/entity';

const fs = require('fs');
const multer = require('koa-multer');
const uuidv1 = require('uuid/v1');
const upload = multer({ dest: 'uploads/' });

@JsonController()
@OpenAPI({
    security: [{ bearerAuth: [] }],
})
export default class ImageController {
    @Authorized()
    @Post('/images/:eventId')
    async handleFileUpload(
        @UploadedFile('file') file: any,
        @CurrentUser() user: User,
        @Param('eventId') eventId: number,
        @Res() response: any
    ) {
        const fileName = uuidv1();
        console.log(fileName);
        console.log(Object.keys(file));
        fs.writeFile(
            `/media/simona/DATA/travelin-images/${fileName}`,
            file.buffer,
            err => {
                if (err) {
                    console.log('image upload failed:', err);
                    response.status = 500;
                    response.body = {
                        message: 'File upload failed.',
                    };
                }
            }
        );
        const image = Image.create();
        image.id = fileName;
        image.mimeType = file.mimetype;
        image.createdAt = new Date();
        const event = await Event.findOne(eventId);
        if (event) image.event = event;
        image.url = `/images/${fileName}`;
        image.user = user;
        return image.save();
    }

    @Get('/images/:fileName')
    async getImageFile(
        @Ctx() ctx: any,
        @Param('fileName') fileName: string,
        @Res() response: any
    ) {
        console.log(fileName);
        const path = `/media/simona/DATA/travelin-images/${fileName}`;
        const image = await Image.findOne(fileName);
        if (!fs.existsSync(path) || !image) {
            response.status = 404;
            response.body = {
                message: `File ${fileName} does not exist`,
            };
            return response;
        } else {
            ctx.type = image.mimeType;
            response.body = fs.readFileSync(path);
            //     , function(err, data) {
            //     if (err) {
            //         response.status = 500;
            //         response.body = {
            //             message: `File ${fileName} could not be retrieved`,
            //         };
            //         return response;
            //     } else {
            //         response.body = data;
            //     }
            // });
        }
        return response;
    }
}
