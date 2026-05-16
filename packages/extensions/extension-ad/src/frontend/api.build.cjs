const ApisdkCreator = require('moyan-api/dist/main.js').ApisdkCreator
const Program = require('moyan-api/dist/program.js').Program

const configs = [
  {
    jsonurl: 'http://localhost:3000/api-docs/ad-extension-json',
    output: './src/apis',
    dirname: 'ad',
  },
]

const create = async () => {
  for (let i = 0; i < configs.length; i++) {
    await new ApisdkCreator(new Program(configs[i])).create()
  }
}

create()
