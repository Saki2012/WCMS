import { StaticRouter } from 'react-router-dom';
import App from '../App';

export function render(url: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>SSR</title></head>
      <body>
        <div id="root">151515
          ${require('react-dom/server').renderToString(
            <StaticRouter location={url} >
              <App />
            </StaticRouter>
          )}
        </div>
      </body>
    </html>
  `;
}