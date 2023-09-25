import React,{useRef, useState} from "react";
import {Form, Button, Card, Container, Alert} from "react-bootstrap"
import {useAuth} from "../../contexts/AuthContexts"
import {Link, useNavigate} from "react-router-dom"

export default function LoginPage(){
const userRef = useRef()
const passwordRef = useRef()
const {login} = useAuth()
const [error, setError] = useState("")
const [loading, setLoading] = useState(false)
const navigate = useNavigate();

  // This function handles the form submit process, It will pass the parameters of userRef (email) and passwordRef (password) to the firebase useAuth method to authenticate login. If successful it will use React navigate to the home page, if not the error will be displayed
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(userRef.current.value, passwordRef.current.value);
      navigate("/"); 
    } catch (error) {
      setError("Failed to log in: " + error.message);
    }
    setLoading(false);
  }
 
  // Simple bootstrap login form UI
  return (
    <Container className="d-flex align-items-center justify-content-center" >
      <div className="w-100" style={{ maxWidth: "400px" }}>
         <Card className="mx-auto">
          <Card.Body>
            <h2 className="text-center">Log In</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email">
                <Form.Label>Email:</Form.Label>
                <Form.Control type="email" ref={userRef} required />
              </Form.Group>
              <Form.Group id="password">
                <Form.Label>Password:</Form.Label>
                <Form.Control type="password" ref={passwordRef} required />
              </Form.Group>
              <div className="text-center">
                <Button disabled={loading} className="mt-3" type="submit">
                  Log In
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Need an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </Container>
  );
}
