import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IncomingHttpHeaders } from 'http';
import { use } from 'passport';
import { Observable } from 'rxjs';
import { KEY_DECORATOR_TYPE_PERMISSION } from 'src/commons/decorators/set-permission-type/set-permission-type.decorator';
import { matchRoute, removeQueryParams, trim } from 'src/commons/utils/string.util';
import { TypePermissions } from 'src/permissions/types/type-permissions.type';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PolicyGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    context.switchToHttp().getRequest();



    const types: TypePermissions[] = this.reflector.get<TypePermissions[]>(KEY_DECORATOR_TYPE_PERMISSION, context.getHandler());

    const request = context.switchToHttp().getRequest();

    const user: User = request.user;

    

    const permissions = [...user.role.permissions.flat()].filter(permission => types.includes(permission.type));



    if (!user) {
      throw new InternalServerErrorException(
        'User is not setting, please check config API',
      );
    }


    if (types.includes(TypePermissions.API)) {
      const URL = `/${trim(removeQueryParams(request.url), '/')}`;
      const METHOD = request.method;
      const route = matchRoute(URL, permissions.filter(permission => permission.method === METHOD));
      return Boolean(route);
    }

    /// TYPE MENU | option

    const header = request.headers as IncomingHttpHeaders;

    const path = header.path as string;

    const route = matchRoute(path, permissions);

    return Boolean(route);

  }



}
