import { toast } from "sonner";

const { useState } = require("react");

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    console.log("📥 useFetch called with args:", args);
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      console.log("✅ API call success, response:", response);
      setData(response);
      setError(null);
    } catch (error) {
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  return { data, loading, error, fn, setData };
};

export default useFetch;
// how useFetch, createAccountFn, and createAccount are wired together. Let’s walk step by step.

// 1. Where useFetch is defined
// cb is the callback function you give to useFetch.

// Inside useFetch, it creates an fn function.

// Later, when you call fn(...), it just runs cb(...) with those arguments.

// 2. Where useFetch is used

// In your component, you do something like:

// const { fn: createAccountFn, data, loading, error } = useFetch(createAccount);

// Here you are passing createAccount (the server action) into useFetch as cb.

// useFetch returns an object, one of whose properties is fn.

// You rename fn → createAccountFn for clarity.

// So now:

// createAccountFn is just a wrapper around createAccount, but with extra logic for loading, error, data.

// 3. What happens on form submit

// Your form handler looks like:

// const onSubmit = (data) => {
//   createAccountFn(data); // <-- data comes from React Hook Form
// };

// Flow:

// React Hook Form collects all the field values (name, balance, isDefault, etc).

// On submit, it calls onSubmit(data).

// That calls createAccountFn(data).

// createAccountFn is really fn inside useFetch.

// Inside fn, we do:

// const response = await cb(...args);

// Here cb is your server action createAccount, so this runs:

// await createAccount(data);

// createAccount runs on the server, talks to DB, and returns { success: true, data: serializedAccount }.

// That result goes back into setData(response).

// You can now use data in your component.

// . Answering your doubt

// how usefetch runned beforehand without data so that it return createaccountfn?

// When your component renders, useFetch(createAccount) is called immediately.

// That sets up the state variables (data, loading, error) and prepares the wrapper function fn.

// But fn doesn’t execute yet — it’s just defined and returned.

// You assign that fn to createAccountFn.

// So:

// First render: useFetch → gives you a createAccountFn.

// Later, when the form is submitted, you call createAccountFn(data), which in turn calls createAccount(data).

// 5. Visual flow
// Form Submit (React Hook Form)
//       ⬇ data
// onSubmit(data)
//       ⬇
// createAccountFn(data)  <-- from useFetch
//       ⬇
// useFetch.fn(...args)   <-- wraps cb
//       ⬇
// await cb(...args)
//       ⬇
// await createAccount(data)   <-- server action
//       ⬇
// DB + logic → response
//       ⬇
// setData(response)
//       ⬇
// return back to component
