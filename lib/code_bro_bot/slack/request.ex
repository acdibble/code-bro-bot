defmodule CodeBroBot.Slack.Request do
  def call do
    IO.puts("sending HTTP request")

    2
    |> :timer.seconds()
    |> :timer.sleep()

    IO.puts("got response ;)")
  end
end
