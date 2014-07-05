# 1.0 milestone

* flat-ui glyphicons are available only in the pro version; all the sandbox examples with icons need work
* the tests need to get updated to run from the command line. The tests in `js/Tests/` are an incomplete list
  that should be expanded to cover all the behaviors and delegators.
* get sandbox deployed onto heroku (@anutron will do this) and buy a domain

# post release

* switch from rails sandbox runner to a nodejs server
* set up travis CI for automated testing
* set up a builder to let users choose which components they'd like to download.
* api documentation. There's a handful of this stuff done already for the files that came from Clientcide and
  More-Behaviors, but not for all the Thanx stuff (where instead we only wrote demo/docs for the behaviors).
  All the classes should have their options, arguments and public methods documented.
* I'd like to include the docs for Behavior in these, too.
