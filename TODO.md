# 1.0 milestone

* Our copy of highcharts is hacked; has references to "thanx" methods; create a fork of the actual repo and use that.
* flat-ui glyphicons are available only in the pro version; all the sandbox examples with icons need work
* flat-ui and bootstrap differ in how they handle `input-group-addon` inputs. see `Behavior.FormValidator.BS.Tips`
* the tests need to get updated to run from the command line. The tests in `js/Tests/` are an incomplete list
  that should be expanded to cover all the behaviors and delegators.
* we should use bower/grunt to create additional output files in the `/dist` directory. Specifically, we should
  compile the less files and copy the font files. Bootstrap's implementation here is a good model.
* get sandbox deployed onto heroku (@anutron will do this) and buy a domain
* remove all uses of `asset-url` ruby helper found in all the thanx/* less files.

# post release

* switch from rails sandbox runner to a nodejs server
* set up travis CI for automated testing
* set up a builder to let users choose which components they'd like to download.
* api documentation. There's a handful of this stuff done already for the files that came from Clientcide and
  More-Behaviors, but not for all the Thanx stuff (where instead we only wrote demo/docs for the behaviors).
  All the classes should have their options, arguments and public methods documented.
* I'd like to include the docs for Behavior in these, too.
