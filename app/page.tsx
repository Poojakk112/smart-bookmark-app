"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [bookmarks, setBookmarks] = useState<any[]>([])

 
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) console.log(error)
      else setBookmarks(data)
    }

    fetchBookmarks()
  }, [user])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setBookmarks([])
  }

  const handleAddBookmark = async () => {
    if (!user) {
      alert("Please login first")
      return
    }

    const { error } = await supabase.from("bookmarks").insert([
      { title, url, user_id: user.id },
    ])

    if (error) console.log(error)
    else {
      alert("Bookmark added!")
      setTitle("")
      setUrl("")
      
      setBookmarks((prev) => [{ title, url, user_id: user.id }, ...prev])
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Smart Bookmark App</h1>

      {!user ? (
        <button
          onClick={handleLogin}
          className="bg-green-500 text-white px-4 py-2 mb-4"
        >
          Login with Google
        </button>
      ) : (
        <>
          <p className="mb-2">Logged in as: {user.email}</p>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 mb-4"
          >
            Logout
          </button>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 mr-2"
            />
            <input
              type="text"
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border p-2 mr-2"
            />
            <button
              onClick={handleAddBookmark}
              className="bg-blue-500 text-white px-4 py-2"
            >
              Add
            </button>
          </div>

          <h2 className="text-xl font-bold mb-2">Your Bookmarks</h2>
          <ul>
  {bookmarks.map((b, i) => (
    <li key={i} className="mb-1 flex items-center justify-between">
      <a href={b.url} target="_blank" className="text-blue-600">
        {b.title}
      </a>
      <button
        onClick={async () => {
          const { error } = await supabase
            .from("bookmarks")
            .delete()
            .eq("user_id", user.id)
            .eq("id", b.id)

          if (error) console.log(error)
          else
            setBookmarks((prev) =>
              prev.filter((item) => item.id !== b.id)
            )
        }}
        className="bg-red-500 text-white px-2 py-1 ml-2"
      >
        Delete
      </button>
    </li>
  ))}
</ul>
        </>
      )}
    </div>
  )
}
