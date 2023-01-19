const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const usernameExistInDatabase = users.some((user) => {
    return user.username === username
  })

  if (!usernameExistInDatabase) {
    return response.status(404).json({ error: 'O usuário não pode ser encontrado na base dados' })
  }

  request.username = username

  next()
}

function checksExistsTodo(request, response, next) {
  const { username } = request
  const { id } = request.params

  const userIndex = users.findIndex((user) => {
    return user.username === username
  })

  const todoIndex = users[userIndex].todos.findIndex((todo) => {
    return todo.id === id
  })

  if (todoIndex < 0) {
    return response.status(404).json({ error: 'O todo não pode ser encontrado' })
  }

  request.todoQuery = {
    userIndex, todoIndex
  }

  next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usernameExistInDatabase = users.some((user) => {
    return user.username === username
  })

  if (usernameExistInDatabase) {
    return response.status(400).json({ error: 'Usuário já existe na base de dados' })
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser)

  return response.status(201).json(newUser)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers

  const currentUser = users.find((user) => {
    return user.username === username
  })

  return response.send(currentUser.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request
  const { title, deadline } = request.body

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  const userIndex = users.findIndex((user) => {
    return user.username === username
  })

  users[userIndex].todos.push(newTodo)

  return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { title, deadline } = request.body
  const { userIndex, todoIndex } = request.todoQuery

  const todo = users[userIndex].todos[todoIndex]

  users[userIndex].todos[todoIndex] = {
    ...todo,
    title,
    deadline: new Date(deadline)
  }

  return response.status(201).json(users[userIndex].todos[todoIndex])
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { userIndex, todoIndex } = request.todoQuery

  const todo = users[userIndex].todos[todoIndex]

  users[userIndex].todos[todoIndex] = {
    ...todo,
    done: true
  }

  return response.json(users[userIndex].todos[todoIndex])
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { userIndex, todoIndex } = request.todoQuery

  users[userIndex].todos.splice(todoIndex, 1)

  return response.status(204).send()
});

module.exports = app;