import { EyeViewPage } from './app.po';

describe('eye-view App', () => {
  let page: EyeViewPage;

  beforeEach(() => {
    page = new EyeViewPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
