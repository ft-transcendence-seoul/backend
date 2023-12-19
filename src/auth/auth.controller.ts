import {
  Controller,
  Get,
  Query,
  Res,
  Req,
  Post,
  Body,
  Param,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { AuthGuard } from './auth.guard';
import { GetUser } from './user.decorator';
import { User } from 'src/users/entities/user.entity';
import { TotpDto } from 'src/secure-shield/dtos/totp.dto';
import { SocketConnectionGateway } from 'src/socket-connection/socket-connection.gateway';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { MulterConfigService } from 'src/commons/MulterConfig.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private socketConnectionGateway: SocketConnectionGateway,
  ) {}

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const socket = await this.socketConnectionGateway.userToSocket(req.user.id);
    if (socket) socket.disconnect(true);
    this.authService.removeSession(req);
    res.clearCookie('session-cookie');
    res.send('로그아웃 성공');
  }

  @Get('sign-in')
  signIn(@Res() res: Response, @Query('callback_uri') callbackUri: string) {
    const state = this.authService.generateRandomString(16);
    res.status(200).send({ data: this.authService.getRedirectUrl(state, callbackUri) });
  }

  @Get('user-redirect')
  async userRedirect(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('callback_uri') callbackUri: string,
  ): Promise<void> {
    const accessToken = await this.authService.getAccessToken(state, code, callbackUri);
    const userEmail = await this.authService.getEmail(accessToken);
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) {
      res.header('Set-Cookie', [
        `access_token=${accessToken}; SameSite=None; Secure; Max-Age=720000; HttpOnly=false`,
      ]);
      res.send({ redirect: 'register' });
      return;
    }

    if (user.is2fa) {
      res.header('Set-Cookie', [
        `access_token=${accessToken}; SameSite=None; Secure; Max-Age=720000; HttpOnly=false`,
      ]);
      res.send({ redirect: '2FA' });
    } else {
      await this.authService.saveSession(req, user);
      res.send({ redirect: 'home' });
    }
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('file', MulterConfigService.createMulterOptions()))
  async userAdd(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
  ): Promise<void> {
    const accessToken = req.cookies['access_token'];
    if (accessToken) {
      const userEmail = await this.authService.getEmail(accessToken);
      const filename = file ? file.fieldname : null;
      const newUser = await this.authService.joinUser(userEmail, filename, createUserDto);
      await this.authService.saveSession(req, newUser);
      res.send({ redirect: 'home' });
    } else {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
  }

  // session 저장, 토큰 반환 테스트를 위한 임시 핸들러
  @Get('login/:email')
  async loginTest(@Req() req: Request, @Res() res: Response, @Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    console.log(`exist email: ${email}`);
    await this.authService.saveSession(req, user);
    res.send(`${email} 로그인 성공`);
  }

  @UseGuards(AuthGuard)
  @Post('2fa/off')
  async deactivate2fa(@Res() res: Response, @GetUser() user: User) {
    await this.usersService.deactivate2fa(user);
    res.send({ success: true });
  }

  @UseGuards(AuthGuard)
  @Post('2fa/setup')
  async getTotpQrCode(@Res() res: Response, @GetUser() user: User): Promise<void> {
    const qrimgurl = await this.authService.initialize2fa(res, user);
    res.send({ qrimgurl: qrimgurl });
  }

  @UseGuards(AuthGuard)
  @Post('2fa/on')
  async activate2fa(
    @Res() res: Response,
    @GetUser() user: User,
    @Body() totpDto: TotpDto,
  ): Promise<void> {
    const result = await this.authService.verifyTotpAndEnable2fa(user, totpDto);
    res.send({ success: result });
  }

  @Post('2fa/login')
  async verifyTotpCode(
    @Req() req: Request,
    @Res() res: Response,
    @Body() totpDto: TotpDto,
  ): Promise<void> {
    const accessToken = req.cookies['access_token'];
    if (accessToken) {
      const userEmail = await this.authService.getEmail(accessToken);
      const result = await this.authService.loginWithTotpValidation(req, userEmail, totpDto);
      res.send({ success: result });
    } else {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
  }
}
