defmodule CodeBroBot.ServerTest do
  use ExUnit.Case, async: true
  use Plug.Test

  setup_all do
    System.put_env("SLACK_SIGNING_SECRET", "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")

    on_exit(fn -> System.delete_env("SLACK_SIGNING_SECRET") end)
  end

  test "pongs" do
    {status, _header, body} =
      conn(:get, "/ping")
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200
    assert body == "pong\n"
  end

  test "handles unknown routes" do
    {status, _header, body} =
      conn(:post, "/404")
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 404
    assert body == "oops"
  end

  test "responds to challenges" do
    body = Jason.encode!(%{"challenge" => "world", "other" => "property"})

    {status, _header, body} =
      authenticated_conn(:post, "/events", body)
      |> put_req_header("content-type", "application/json")
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200
    assert body == Jason.encode!(%{"challenge" => "world"})
  end

  defp authenticated_conn(method, path, params_or_body) do
    timestamp = DateTime.utc_now() |> DateTime.to_unix() |> Integer.to_string()
    string = "v0:#{timestamp}:#{params_or_body}"

    IO.inspect([:sha256, System.get_env("SLACK_SIGNING_SECRET"), string])

    signature =
      :crypto.hmac(:sha256, System.get_env("SLACK_SIGNING_SECRET"), string)
      |> Base.encode16()

    conn(method, path, params_or_body)
    |> put_req_header("x-slack-request-timestamp", timestamp)
    |> put_req_header("x-slack-signature", "v0=#{signature}")
  end
end
