import { useState, useEffect } from 'react'
import { db } from './firebase'
import {
  collection,
  addDoc,
  onSnapshot
} from 'firebase/firestore'

const [todos, setTodos] = useState([])
const [input, setInput] = useState("")

useEffect(() => {
  const colRef = collection(db, "todos")  // "todos" isminde koleksiyon

  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data().text)
    setTodos(list)
  })

  return () => unsubscribe()
}, [])

const addTodo = async () => {
  if (!input.trim()) return

  await addDoc(collection(db, "todos"), {
    text: input,
    createdAt: Date.now()
  })

  setInput("")  // input'u temizle
}

return (
  <div style={{ padding: "20px" }}>
    <h1>Firestore Test</h1>

    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Bir şey yaz..."
    />

    <button onClick={addTodo}>Ekle</button>

    <ul>
      {todos.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </div>
)