import { Switch, Route } from "wouter";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import Reports from "@/pages/Reports";

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/assessment" component={Assessment} />
        <Route path="/reports" component={Reports} />
        <Route>404 Page Not Found</Route>
      </Switch>
    </Layout>
  );
}

export default App;
