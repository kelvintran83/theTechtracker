# theTechtracker

theTechtracker is a web application built with React that allows users to explore and read the latest technology news articles on the most popular technology companies (Google, Meta, Apple, Amazon, NVIDIA, Microsoft and Tesla ). It utilises the News API to fetch and display articles from various sources, providing users with a convenient way to stay up-to-date with the latest tech news. Users may make accounts to log in and favourite articles so they can access them easily whenever they want to.


## Features

- Main page with feed of relevant and latest articles.
- Search articles by a search engine, filtering articles based on keywords as well as through which company by the navigation bar.
- View detailed information about each article, including the title, description, source, and publication date. C
- Click on an article to read the full content on the source website.
- Account functionality enabled for simple register and login.
- Favourite articles and access them easily through the saved articles page.



## Installation

To run this project locally, follow these steps:

1. Clone the repository: `git clone https://github.com/yourusername/theTechtracker.git`
2. Navigate to the project directory: `cd theTechtracker`
3. Install dependencies: `npm install`
4. Start the development server: `npm start`

## Usage

- Visit the app in your web browser.
- Use the search bar to look for specific articles or explore the latest news.
- Click on an article to read the full content on the source website.

## Technologies Used

- React: A JavaScript library for building user interfaces.
- News API: An API that provides access to a wide range of news articles from different sources.
- Alpha Vantage API: Used for stock value data on companies to display on the website's stock tracker. No longer used in final version due to API constraints for free plan (5 API calls a minute). Using hard-coded data to show the concept.
- Bootstrap for sign in and register UI forms.
- Firestore and Firebase for authentication and databases for account and article information.

## Contributing

Contributions are welcome! If you would like to contribute to this project, please follow these guidelines:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

- Kelvin Tran (https://github.com/kelvintran83)
- kelvintran8383@gmail.com
