defmodule CodeBroBot.Server do
  use Plug.Router

  plug(:match)
  plug(:dispatch)

  get "/ping" do
    send_resp(conn, 200, "pong\n")
  end

  forward("/events", assigns: %{type: :event}, to: CodeBroBot.Server.AuthenticatedRouter)

  match _ do
    send_resp(conn, 404, "oops")
  end
end
