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
  def handle_cast(
        %{
          "event" => %{
            "type" => "app_mention",
            "channel" => channel,
            "text" => text,
            "user" => user
          }
        },
        nil
      ) do
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
  defp get_response("version"), do: "elixir"
  defp get_response("coronavirus update"), do: get_report(0)
  defp get_response(_), do: "I don't know what to do with my hands"

  defp get_report(10), do: "Unable to get results"

  defp get_report(days_back)
       when is_integer(days_back) and days_back < 10 do
    case HTTPoison.get(get_url(days_back)) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        String.split(body, "\n") |> parse_report(%{}) |> IO.inspect()
        "parsed"

      _ ->
        get_report(days_back + 1)
    end
  end

  defp get_url(days_back) do
    [year, month, day] =
      Date.utc_today()
      |> Date.add(-1 * days_back)
      |> Date.to_string()
      |> String.split("-")

    base_url() <> Enum.join([month, day, year], "-") <> ".csv"
  end

  defp base_url do
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/"
  end

  defp parse_report([head | tail], map) do
    updated =
      if String.contains?(head, ",US,") do
        IO.puts("#{head}: #{String.ends_with?(head, ", US\"")}")
        parse_line(head, map)
      else
        map
      end

    parse_report(tail, updated)
  end

  defp parse_report([], map), do: generate_report(map)

  defp parse_line(line, map) do
    parts = String.split(line, ",")
    state = Enum.at(parts, 2)
    last_reported = Enum.at(parts, 4)

    [confirmed, deaths, recovered, active] =
      Enum.map([7, 8, 9, 10], &(Enum.at(parts, &1) |> String.to_integer()))

    Map.merge(
      map,
      %{
        state => %{
          "last_reported" => last_reported |> String.split(" ") |> List.first(),
          "confirmed" => confirmed,
          "deaths" => deaths,
          "recovered" => recovered,
          "active" => active
        }
      },
      &merge_helper/3
    )
  end

  defp merge_helper(_, a, b) when is_map(a) and is_map(b), do: Map.merge(a, b, &merge_helper/3)
  defp merge_helper(_, a, b) when is_integer(a) and is_integer(b), do: a + b
  defp merge_helper(_, a, b), do: if(a < b, do: a, else: b)

  defp generate_report(map) do
    Enum.map(map, fn {state, data} ->
      nil
    end)
  end
end
