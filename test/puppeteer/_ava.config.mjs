export default {
  files: ["./test/puppeteer/**/*.spec.mjs"],
  require: ["./test/puppeteer/_setup/helpers.mjs"],
  timeout: "5m",
  concurrency: 3
}
