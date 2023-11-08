# Forum API

### Users & Authentications

- Registrasi pengguna

`POST /users`

- Login pengguna

`POST /authentications`

- Memperbarui autentikasi / refresh access token

`PUT /authentications`

- Logout pengguna

`DELETE /authentications`

### Threads

- Menambahkan thread

`POST /threads`

- Melihat Detail Thread

`GET /threads/{threadId}`

### Thread Comments

- Menambahkan Komentar pada Thread

`POST /threads/{threadId}/comments`

- Menghapus Komentar pada Thread

`DELETE /threads/{threadId}/comments/{commentId}`

- Menyukai atau batal menyukai Komentar pada Thread

`PUT /threads/{threadId}/comments/{commentId}/likes`

### Thread Comment Replies

- Menambahkan Balasan pada Komentar Thread

`POST /threads/{threadId}/comments/{commentId}/replies`

- Menghapus Balasan pada Komentar Thread

`DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}`
