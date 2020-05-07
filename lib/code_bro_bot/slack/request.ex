defmodule CodeBroBot.Slack.Request do
  def call(body) do
    {:ok, conn} = Mint.HTTP.connect(:https, "slack.com", 443)

    {:ok, conn, _ref} =
      Mint.HTTP.request(conn, "POST", "/api/chat.postMessage", req_headers(), Jason.encode!(body))

    receive do
      message ->
        case Mint.HTTP.stream(conn, message) do
          {:ok, _conn, responses} -> responses
        end
    end
  end

  defp req_headers do
    [
      {"content-type", "application/json;charset=utf8"},
      {"authorization", "Bearer #{System.get_env("SLACK_OAUTH_TOKEN")}"}
    ]
  end
end
