import {
    JsonController,
    Get,
    Body,
    Post,
    getMetadataArgsStorage,
    Authorized,
    CurrentUser,
    Res,
    QueryParam,
} from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import User from './entity';

@JsonController()
export default class UserController {
    @Authorized()
    @Get('/users')
    async getUser(
        @QueryParam('id') id: number,
        @CurrentUser() user: User,
        @Res() response: any
    ) {
        try {
            if (user.id === id) return await User.findOne(id);
        } catch (err) {
            console.log(err);
            response.status = 404;
            response.body = { message: 'Cannot find this user.' };
        }
    }

    @Post('/users')
    async createUser(@Body() user: User, @Res() response: any) {
        const { password, ...rest } = user;
        const entity = User.create(rest);

        try {
            await entity.setPassword(password);
            return await entity.save();
        } catch (err) {
            console.log(err);
            response.status = 400;
            response.body = { message: 'Cannot create this user.' };
        }
    }

    @Get('/spec')
    getSpec() {
        const storage = getMetadataArgsStorage();
        const spec = routingControllersToSpec(storage);
        console.log(spec);
        return spec;
    }
}
