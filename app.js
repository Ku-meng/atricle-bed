const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')

const connectUri = 'mongodb://localhost:27017'

const dbClient = new MongoClient(connectUri)

const app = express()

// 配置解析请求体数据 application/json
// 它会把解析到的请求体数据放到 req.body
//    一定要在使用之前挂载这个中间件
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello word')
})

app.post('/articles', async (req, res, next) => {
  try {
    // 获取客户端表单数据
    const { article } = req.body

    // 数据验证
    if (!article || !article.title || !article.description || !article.body) {
      return res.status(422).json({
        error: '请求参数不符合规则'
      })
    }

    // 把验证通过的数据插入数据库
    //    成功 -> 发送成功响应
    //    失败 -> 发送失败响应
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    article.createAt = new Date()
    article.updateAt = new Date()
    const ret = await collection.insertOne(article)
    article._id = ret.insertedId
    res.status(201).json({
      article
    })
  } catch (error) {
    // 由错误处理中间件统一处理
    next(error)
    // res.status(500).json({
    //   error: error.message
    // })
  }
})

app.get('/articles', async (req, res, next) => {
  try {
    let { _page = 1, _size = 10 } = req.query
    _page = Number.parseInt(_page)
    _size = Number.parseInt(_size)
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    const ret = await collection
      .find() // 查询数据
      .skip((_page - 1) * _size) // 跳过多少条
      .limit(_size) // 拿多少条
    const articles = await ret.toArray()
    const articlesCount = await collection.countDocuments()
    res.status(200).json({
      articles,
      articlesCount
    })
  } catch (error) {
    next(error)
  }
})

app.get('/articles/:id', async (req, res, next) => {
  try {
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    const article = await collection.findOne({
      _id: ObjectId(req.params.id)
    })
    res.status(200).json({
      article
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/articles/:id', async (req, res, next) => {
  try {
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    await collection.updateOne({
      _id: ObjectId(req.params.id)
    }, {
      $set: req.body.article
    })
    
    const article = await collection.findOne({
      _id: ObjectId(req.params.id)
    })
    res.status(201).json({
      article
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/articles/:id', (req, res) => {
  res.send('delete/articles/:id')
})

// 他之前所有路由中调用 next(err) 就会进入这里
//    4和参数，缺一不可
app.use((err, req, res, next) => {
  res.status(500).json({
    err: err.message
  })
})

app.listen(3000, () => {
  console.log('app listenning at port 3000.')
})
