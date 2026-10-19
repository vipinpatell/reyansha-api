import { Controller, Get, Header } from '@nestjs/common';
import { Public } from './modules/auth/auth.decorator.js';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Public()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getRoot() {
    return this.appService.getHomePage();
  }

  @Get('info')
  @Public()
  getApiInfo() {
    return this.appService.getApiInfo();
  }
}
