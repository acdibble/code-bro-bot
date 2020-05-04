defmodule CodeBroBot.ServerTest do
  use ExUnit.Case, async: true
  use Plug.Test

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
    challenge_map = %{"challenge" => "world", "other" => "property"}

    {status, _header, body} =
      authenticated_conn(:post, "/events", Jason.encode!(challenge_map))
      |> put_req_header("content-type", "application/json")
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200
    assert body == Jason.encode!(%{"challenge" => "world"})
  end

  defp authenticated_conn(method, path, params_or_body) do
    timestamp = DateTime.utc_now() |> DateTime.to_unix() |> Integer.to_string()

    conn(method, path, params_or_body)
    |> put_req_header("x-slack-request-timestamp", timestamp)
  end
end
