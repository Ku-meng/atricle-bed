const express = require('express')

const app = express()

app.get('/', (req, res) => {
  res.send('Hello word')
})

app.listen(3000, () => {
  console.log('app listenning at port 3000.')
})
