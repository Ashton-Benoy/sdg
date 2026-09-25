# Wattwise Building Energy

A responsive building energy dashboard made with plain HTML, CSS, and JavaScript. It has no package dependencies or build step, so the same files run in VS Code and on a static web host.

## Run it locally

1. Open the `dashboard` folder in VS Code.
2. Open `index.html` with the Live Server extension, or double-click it to open it in a browser.
3. The page refreshes its preset building readings every 10 seconds. Changes to settings and checklists live in JavaScript memory and reset when the page reloads.

## Pages and features

- **Overview:** power, energy, predictions, usage charts, and alerts.
- **Live monitoring:** searchable room and equipment readings with CSV export.
- **Energy history:** room and period filters, expandable reading log, and CSV export.
- **Predictions:** a clear next-reading estimate from recent values.
- **Recommendations:** actionable energy tips with a save checklist.
- **Sustainability:** estimated carbon impact and potential reductions.
- **Energy planner:** a completion checklist with estimated energy and carbon savings.
- **Cost estimator:** configurable currency and electricity rate, period costs, a 30-day projection, and CSV export.
- Room and date filters, editable alert threshold, daily energy goal, and manual reading refresh.

Sensor readings are preset examples. The site does not connect to external hardware or send data to a service.

## Deploy to Netlify

The `netlify.toml` file sets the site root to this folder and configures security headers. There is no build command.

1. Create a new static site in Netlify and choose the dashboard folder as the site directory, or drag the folder contents into Netlify Drop.
2. If prompted for settings, leave the build command empty and set the publish directory to `.`.
3. Deploy. The site uses relative asset paths, so it can be served from a standard static domain.

## Deploy to Vercel

The `vercel.json` file adds the same security headers. Import this folder as a static project, choose **Other** as the framework preset, leave the build command empty, and use `.` as the output directory.

## Project files

- `index.html` - page structure and content.
- `style.css` - layout, colors, charts, and responsive styling.
- `app.js` - preset readings, calculations, and page interactions.
- `favicon.svg` and `manifest.webmanifest` - browser identity and install metadata.
- `netlify.toml` and `vercel.json` - static hosting settings.
