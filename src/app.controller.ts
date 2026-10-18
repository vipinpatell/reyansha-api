
import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getRoot() {
    return this.appService.getHomePage();
  }

  @Get('api/v1')
  getApiV1Root() {
    return this.appService.getApiInfo();
  }
}
