import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your Next.js URL
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
})

let orders = []

io.on("connection", (socket) => {
  console.log("Kitchen client connected")

  socket.on("disconnect", () => {
    console.log("Kitchen client disconnected")
  })
})

// API route: create order
app.post("/api/orders", (req, res) => {
  const newOrder = { ...req.body, id: Date.now().toString() }
  orders.push(newOrder)
  io.emit("newOrder", newOrder)
  res.status(201).json(newOrder)
})

// API route: update order
app.put("/api/orders/:id", (req, res) => {
  const { id } = req.params
  const index = orders.findIndex(o => o.id === id)
  if (index !== -1) {
    orders[index] = { ...orders[index], ...req.body }
    io.emit("orderUpdate", orders[index])
    return res.json(orders[index])
  }
  res.status(404).send("Order not found")
})

// API route: delete order
app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params
  orders = orders.filter(o => o.id !== id)
  io.emit("deleteOrder", id)
  res.status(204).send()
})

// Serve orders
app.get("/api/v1/kitchenorders", (req, res) => {
  res.json(orders)
})

server.listen(3001, () => {
  console.log("Socket.IO server running on http://localhost:3001")
})
