const Company = require("./model");
const axios = require("axios");
const companyController = {
  // Create a new company
  createCompany: async (req, res) => {
    try {
      console.log(req.body.company);
      const exsistingCompany = await Company.findOne({
        company: req.body.company,
      });
      //  Response for the company is found .
      if (exsistingCompany) {
        return res.status(409).json({
          message: "Company already exists",
        });
      }
      // Create the company if the company is not found.
      const company = new Company(req.body);
      const savedCompany = await company.save();

      res.status(201).json({
        message: "Company created successfully",
        company: savedCompany,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  },
  getAllCompanies: async (req, res) => {
    try {
      const companies = await Company.find();
      console.log(companies);
      res.status(200).json({ companies: companies });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  // Get company by ID
  getCompanyById: async (req, res) => {
    try {
      const company = await Company.findById(req.params.id);
      if (!company)
        return res.status(404).json({ message: "Company not found" });
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  // Update company
  updateCompany: async (req, res) => {
    try {
      const updatedCompany = await Company.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedCompany)
        return res.status(404).json({ message: "Company not found" });
      res.json(updatedCompany);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  // Delete company
  deleteCompany: async (req, res) => {
    try {
      const company = await Company.findByIdAndDelete(req.params.id);
      if (!company)
        return res.status(404).json({ message: "Company not found" });
      res.json({ message: "Company deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  // Add a generator to a specific type
  addGenerator : async (req, res) => {
    try {
      const { id, type } = req.params;
      const generatorData = req.body;
  
      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
  
      if (!company.Generator[type]) {
        return res.status(400).json({ message: "Invalid generator type" });
      }
  
      // Check if tag already exists in this generator type
      const tagExists = company.Generator[type].some(
        gen => gen.tags === generatorData.tags
      );
  
      if (tagExists) {
        return res.status(400).json({ 
          message: "Tag already exists in this generator type",
          error: "DUPLICATE_TAG"
        });
      }
  
      company.Generator[type].push(generatorData);
      const updatedCompany = await company.save();
  
      res.status(201).json(updatedCompany);
    } catch (error) {
      console.error('Error adding generator:', error);
      res.status(400).json({ 
        message: error.message,
        error: "ADD_FAILED"
      });
    }
  },  
  updateUrlAndId: async (req, res) => {
    try {
      console.log(req.body);
      const updatedCompany = await Company.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedCompany)
        return res.status(404).json({ message: "Company not found" });
      res.json("The credentials are updated");
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  },
  // Update a specific generator
   updateGenerator : async (req, res) => {
    try {
      const { id, type, generatorId } = req.params;
      const updateData = req.body;
  
      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
  
      // Check if this is a tag update
      if (updateData.tags) {
        // Check for duplicate tags in the same generator type, excluding the current generator
        const tagExists = company.Generator[type].some(
          gen => gen._id.toString() !== generatorId && gen.tags === updateData.tags
        );
  
        if (tagExists) {
          return res.status(400).json({ 
            message: "Tag already exists in this generator type",
            error: "DUPLICATE_TAG"
          });
        }
      }
  
      const generatorIndex = company.Generator[type].findIndex(
        (gen) => gen._id.toString() === generatorId
      );
  
      if (generatorIndex === -1) {
        return res.status(404).json({ message: "Generator not found" });
      }
  
      // Update the generator with new data
      company.Generator[type][generatorIndex] = {
        ...company.Generator[type][generatorIndex].toObject(),
        ...updateData,
      };
  
      const updatedCompany = await company.save();
      res.json(updatedCompany);
  
    } catch (error) {
      console.error('Error updating generator:', error);
      res.status(400).json({ 
        message: error.message,
        error: "UPDATE_FAILED"
      });
    }
  },
  deleteGenerator: async (req, res) => {
    try {
      const { id, type, generatorId } = req.params;

      const company = await Company.findById(id);
      if (!company)
        return res.status(404).json({ message: "Company not found" });

      company.Generator[type] = company.Generator[type].filter(
        (gen) => gen._id.toString() !== generatorId
      );

      const updatedCompany = await company.save();
      res.json(updatedCompany);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
   getArticles : async (req, res) => {
    const { id, Handle } = req.body;
    console.log(req.body);
    console.log(req.body.Handle);
  
    try {
      const company = await Company.findById(id);
      console.log(company, id);
  
      // Initialize variables for pagination
      let allArticles = [];
      let hasNextPage = true;
      let nextPageInfo = '';
  
      while (hasNextPage) {
        try {
          const response = await axios.get(
            `https://${company.shopify_url}/admin/api/2025-01/articles.json`,
            {
              headers: {
                "X-Shopify-Access-Token": company.shopify_id,
                "Content-Type": "application/json",
              },
              params: {
                limit: 250,
                fields: 'id,title,handle,image',
                ...(nextPageInfo ? { page_info: nextPageInfo } : {})
              },
            }
          );
  
          // Add current page articles to our collection
          allArticles = allArticles.concat(response.data.articles);
  
          // Check for next page in Link header
          const link = response.headers['link'];
          if (link && link.includes('next')) {
            const nextLink = link.split(',').find(str => str.includes('next'));
            const matches = nextLink.match(/page_info=([^>&]*)/);
            if (matches && matches[1]) {
              nextPageInfo = matches[1];
            }
          } else {
            hasNextPage = false;
          }
  
          // Add a small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
  
        } catch (error) {
          if (error.response?.status === 429) {
            // Rate limited - wait and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }
      }
  
      console.log('Total articles fetched:', allArticles.length);
  
      const filteredArray = allArticles.filter((article) =>
        Handle.includes(article?.handle)
      );
  
      const filteredArticles = filteredArray.map((article) => ({
        title: article.title,
        image: article.image,
        handle: article.handle
      }));
  
      console.log(filteredArticles);
      res.status(200).json({ articles: filteredArticles });
  
    } catch (error) {
      console.error("Error fetching articles:", error.message);
      res.status(error.response?.status || 500).json({
        error: error.message,
      });
    }
  }
};
module.exports = companyController;