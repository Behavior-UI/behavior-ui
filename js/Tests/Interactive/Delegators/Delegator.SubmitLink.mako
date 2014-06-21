<!DOCTYPE html>
<html>
	<head>
		<title>Delegator.SubmitLink</title>
		<script src="/depender/build?require=More-Behaviors/Delegator.SubmitLink"></script>
	</head>
	<body>

		<p>Click either submit button to update the box below. The whole page should be submitted and when it reloads the box should display which link button or link you clicked.</p>

		<form action="?project=Behavior-UI&path=/Delegators/Delegator.SubmitLink.mako" method="post" style="margin: 6px 0px 0px;">
			<input type="submit" name="button" value="fetch html (button 1)"/>
			<input type="submit" name="button" value="fetch html (button 2)"/>
			<a data-trigger="submitLink" data-submitlink-extra-data="{'link':'fetch html (link 1)'}">fetch html (link 1)</a>
			<a data-trigger="submitLink" data-submitlink-extra-data="{'link':'fetch html (link 2)'}">fetch html (link 2)</a>
		</form>

		<div style="position: relative; margin-top: 10px">
			<div id="update" style="padding: 10px; width: 400px; border: 1px solid black; height: 150px; overflow:hidden;">
				% if post_vars:
					You submitted the following values:
					<ul>
						% for post_var, val in post_vars:
						 <li>${post_var}: ${val}</li>
						% endfor
					</ul>
				% else:
					this box should get new text when you click the input above.
				% endif
			</div>
		</div>

		<script>
		new Delegator().attach(document.body);
		</script>

	</body>
</html>
