defmodule CodeBroBot.Slack.Request do
  def call(body) do
    HTTPoison.post(
      "https://slack.com/api/chat.postMessage",
      Jason.encode!(body),
      [
        {"content-type", "application/json;charset=utf8"},
        {"authorization", "Bearer #{System.get_env("SLACK_OAUTH_TOKEN")}"}
      ]
    )
  end
end
