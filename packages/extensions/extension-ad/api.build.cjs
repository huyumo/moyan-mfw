const path = require('path')

const moyanApiDir = path.dirname(
  require.resolve('moyan-api/package.json', {
    paths: [path.join(__dirname, '..', '..', 'base-frontend')],
  }),
)

const { ApisdkCreator } = require(path.join(moyanApiDir, 'dist', 'main.js'))
const { Program } = require(path.join(moyanApiDir, 'dist', 'program.js'))

const configs = [
  {
    jsonurl: 'http://localhost:3002/api-docs/ad-json',
    output: './src/frontend/apis',
    dirname: 'ad',
  },
]

const create = async () => {
  for (let i = 0; i < configs.length; i++) {
    await new ApisdkCreator(new Program(configs[i])).create()
  }
}

create()
