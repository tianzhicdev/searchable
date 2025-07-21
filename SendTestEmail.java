import java.io.File;
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.JsonNode;
import com.mashape.unirest.http.Unirest;
import com.mashape.unirest.http.exceptions.UnirestException;

public class SendTestEmail {
    public static void main(String[] args) {
        try {
            JsonNode result = sendSimpleMessage();
            System.out.println("Email sent successfully!");
            System.out.println("Response: " + result.toString());
        } catch (UnirestException e) {
            System.err.println("Failed to send email: " + e.getMessage());
            System.exit(1);
        }
    }
    
    public static JsonNode sendSimpleMessage() throws UnirestException {
        String apiKey = System.getenv("API_KEY");
        if (apiKey == null) {
            apiKey = "API_KEY";
        }

        HttpResponse<JsonNode> request = Unirest.post("https://api.mailgun.net/v3/sandbox40099185e5954b6c884f2ae7bc6c5a72.mailgun.org/messages")
            .basicAuth("api", apiKey)
            .queryString("from", "Mailgun Sandbox <postmaster@sandbox40099185e5954b6c884f2ae7bc6c5a72.mailgun.org>")
            .queryString("to", "tianzhi chen <tianzhic.dev@gmail.com>")
            .queryString("subject", "Hello tianzhi chen")
            .queryString("text", "Congratulations tianzhi chen, you just sent an email with Mailgun! You are truly awesome!")
            .asJson();
        return request.getBody();
    }
}