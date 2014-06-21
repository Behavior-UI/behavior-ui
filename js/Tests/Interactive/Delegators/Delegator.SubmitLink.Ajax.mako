% if post_vars:
  You submitted the following values:
  <ul>
    % for post_var, val in post_vars:
     <li>${post_var}: ${val}</li>
    % endfor
  </ul>
% else:
  <!DOCTYPE html>
  <html>
    <head>
      <title>Delegator.SubmitLink</title>
      <script src="/depender/build?require=More-Behaviors/Delegator.SubmitLink,More-Behaviors/Behavior.FormRequest"></script>
      <link rel="stylesheet" type="text/css" href="/asset/Behavior-UI/spinner.css" />
    </head>
    <body>

      <p>Click either submit button to update the box below. The whole page should be submitted and when it reloads the box should display which link button or link you clicked.</p>

      <form action="?project=Behavior-UI&path=/Delegators/Delegator.SubmitLink.Ajax.mako" method="post" style="margin: 6px 0px 0px;" data-formrequest-options="'update':'!body #update'" data-behavior="FormRequest">
        <input type="hidden" name="sleep" value="1"/>
        <input type="submit" name="button" value="fetch html (button 1)"/>
        <input type="submit" name="button" value="fetch html (button 2)"/>
        <a data-trigger="submitLink" data-submitlink-extra-data="{'link':'fetch html (link 1)'}">fetch html (link 1)</a>
        <a data-trigger="submitLink" data-submitlink-extra-data="{'link':'fetch html (link 2)'}">fetch html (link 2)</a>
      </form>

      <div id="update" style="padding: 10px; width: 400px; border: 1px solid black; height: 150px; overflow:hidden;">
          this box should get new text when you click the input above.
      </div>

      <script>
      var b = new Behavior().apply(document.body);
      new Delegator({
        getBehavior: function(){ return b; }
      }).attach(document.body);
      </script>

    </body>
  </html>
  % endif
