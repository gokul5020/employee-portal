# Backend account provisioning

Sign-in authenticates against the `users` table. Passwords are stored as bcrypt
hashes; the original password is never written to the database.

To create a new employee in the running Docker environment:

```powershell
docker compose exec backend python -m app.create_user
```

The command prompts for the work email, employee name, optional department and
position, and a password entered without echo. New accounts receive the
employee role; registration is not exposed publicly. Use a unique password of
at least 12 characters. The employee can then sign in at `http://localhost:3000`.

The demo accounts shown on the login screen are separate seeded sample users.
