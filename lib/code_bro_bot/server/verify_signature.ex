defmodule CodeBroBot.Server.VerifySignature do
  def init(opts) do
    IO.inspect(opts)
  end

  def call(conn, opts) do
    IO.inspect(conn)
    IO.inspect(opts)
    {raw_body, _} = Map.pop(conn.assigns, :raw_body)
    body = Enum.join(raw_body)

    timestamp_is_valid =
      Plug.Conn.get_req_header(conn, "x-slack-request-timestamp")
      |> Enum.at(0)
      |> String.to_integer()
      |> request_is_fresh?()

    signature =
      Plug.Conn.get_req_header(conn, "x-slack-signature")
      |> Enum.at(0)

    conn
  end

  def request_is_fresh?(timestamp) do
    DateTime.utc_now()
    |> DateTime.to_unix()
    |> Kernel.-(timestamp)
    |> IO.inspect()
    |> Kernel.<=(5 * 60)
  end
end
