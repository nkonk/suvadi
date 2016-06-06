# suvadi
A hackernews clone

#What works:
	1. A list of news items added by users appears in chronological order(latest first).
	2. A guest user can view all items and navigate to them.
	3. To add or vote an item a user has to login.
	4. Password based registration/login system with validations.
	5. Once logged in the user can
		i.) Create any number of news items
		ii.) Upvote his favorite news items.(voting allowed only once and undoing a vote is not allowed)
#What doesnt/Caveats:

1. Plaintext authentication. login/register not via ssl.
2. Addition of news items is not regulated via captcha,vulnerable 
   to DOS attack by automated addition of news items/need to integrate captcha or rate limitation.
3. User cannot downvote once his vote is cast on an item.(not sure if this is a feature or caveat)

