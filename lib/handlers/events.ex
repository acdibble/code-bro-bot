defmodule CodeBroBot.Handlers.Events do
  use GenServer

  @spec start_link(any) :: :ignore | {:error, any} | {:ok, pid}

  def start_link(_arg) do
    IO.puts("Starting events handler...")
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @spec init(:ok) :: {:ok, nil}

  @impl true
  def init(:ok), do: {:ok, nil}

  @spec process(Plug.Conn.t()) :: Plug.Conn.t()

  def process(%Plug.Conn{} = conn) do
    GenServer.cast(__MODULE__, conn.body_params)
    conn
  end

  @impl true
  def handle_info({ref, _result}, nil) when is_reference(ref) do
    {:noreply, nil}
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, _pid, _status}, nil) do
    {:noreply, nil}
  end

  @impl true
  def handle_cast(%{"event" => %{"type" => "app_mention"}} = event, nil) do
    %{"event" => %{"channel" => channel, "text" => text, "user" => user}} = event

    Task.Supervisor.async_nolink(CodeBroBot.Handlers.TaskSupervisor, fn ->
      CodeBroBot.Slack.Request.call(%{
        "channel" => channel,
        "text" => text |> String.trim() |> get_response(user)
      })
    end)

    {:noreply, nil}
  end

  @impl true
  def handle_cast(map, nil) when is_map(map) do
    IO.puts("Handling unknown event: #{inspect(map)}")
    {:noreply, nil}
  end

  defp get_response(text, user) when is_binary(user) do
    case Regex.match?(~r/^<@[A-Z0-9].+?>$/, text) do
      true ->
        "<@#{user}>?"

      _ ->
        String.replace(text, ~r/<@[A-Z0-9].+?>/, "")
        |> String.trim()
        |> get_response()
    end
  end

  defp get_response("your source"), do: "https://github.com/acdibble/code-bro-bot"
  defp get_response("ping"), do: "pong"
  defp get_response("version"), do: Application.spec(:code_bro_bot, :vsn) |> to_string()
  defp get_response(_), do: "I don't know what to do with my hands"
end
