export default function VulnerableDemoPage() {
  const fakeOpenAiKey = "sk-demo1234567890abcdefghijklmnopqrstuvwxyz1234";
  const fakeGithubToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz123456";
  const fakeAwsKey = "AKIA1234567890ABCDEF";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-black text-ink">Demo Launch App</h1>
      <p className="mt-4 text-gray-700">
        This page intentionally includes common pre-launch mistakes so Redline can show real findings.
      </p>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const user = { email: "founder@example.com" };
            const token = "demo_auth_token_1234567890abcdef";
            const OPENAI_API_KEY = "${fakeOpenAiKey}";
            const GITHUB_TOKEN = "${fakeGithubToken}";
            const AWS_ACCESS_KEY_ID = "${fakeAwsKey}";
            localStorage.setItem("auth_token", token);
            console.log(user.email, OPENAI_API_KEY, GITHUB_TOKEN, AWS_ACCESS_KEY_ID);
          `
        }}
      />
      <form className="mt-8 rounded border border-line bg-white p-5" method="post" action="/demo/api">
        <label className="block text-sm font-semibold text-gray-700" htmlFor="email">
          Invite email
        </label>
        <input className="mt-2 w-full rounded border border-line px-3 py-2" id="email" name="email" type="email" />
        <button className="mt-4 rounded bg-ink px-4 py-2 font-semibold text-white" type="submit">
          Invite user
        </button>
      </form>
    </main>
  );
}
